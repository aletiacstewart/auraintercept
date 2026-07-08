import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, companyId, fileName } = await req.json();

    if (!content || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Content and companyId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authz = await authorizeInternalRequest(req, companyId);
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing FAQ document: ${fileName} for company: ${companyId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to extract FAQ pairs from the document
    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting FAQ (Frequently Asked Questions) from documents.
Your task is to identify and extract question-answer pairs from the provided document content.

Rules:
1. Extract clear, concise questions and their corresponding answers
2. If a category is apparent (like "Pricing", "Services", "Hours", "Policies"), include it
3. Clean up the text - fix typos, improve grammar if needed
4. Only extract actual Q&A content, skip headers, footers, or unrelated content
5. If the document doesn't contain any FAQ-like content, return an empty array

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "The question text",
    "answer": "The answer text",
    "category": "Optional category name or null"
  }
]

Do not include any other text, markdown, or explanation - just the JSON array.`
          },
          {
            role: "user",
            content: `Extract all FAQ question-answer pairs from this document:\n\n${content}`
          }
        ],
      });
    if (responseFellBack) console.warn(`[parse-faq-document] primary model unavailable, served by ${responseModel}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", aiContent);

    // Parse the AI response
    let faqs: Array<{ question: string; answer: string; category: string | null }>;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = aiContent.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      faqs = JSON.parse(cleanedContent);
      
      if (!Array.isArray(faqs)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse FAQ content from document. Please ensure the document contains clear Q&A content." }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (faqs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No FAQ content found in the document. Please upload a document with clear question-answer pairs." }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and filter FAQs
    const validFaqs = faqs.filter(faq => 
      faq.question && 
      typeof faq.question === 'string' && 
      faq.question.trim().length > 0 &&
      faq.answer && 
      typeof faq.answer === 'string' && 
      faq.answer.trim().length > 0
    );

    if (validFaqs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid FAQ pairs found after validation." }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert FAQs into the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const faqsToInsert = validFaqs.map((faq, index) => ({
      company_id: companyId,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      category: faq.category?.trim() || null,
      is_active: true,
      sort_order: index,
    }));

    const { data: insertedFaqs, error: insertError } = await supabase
      .from('faqs')
      .insert(faqsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting FAQs:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save FAQs to database", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully imported ${insertedFaqs?.length || 0} FAQs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedFaqs?.length || 0,
        faqs: insertedFaqs,
        message: `Successfully imported ${insertedFaqs?.length || 0} FAQs from the document`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing FAQ document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
