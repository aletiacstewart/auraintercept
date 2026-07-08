import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, companyId } = await req.json();

    if (!documentContent || !companyId) {
      return new Response(
        JSON.stringify({ error: "Document content and company ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authz = await authorizeInternalRequest(req, companyId);
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing inventory document for company:", companyId);
    console.log("Document content length:", documentContent.length);

    // Use AI to extract inventory items from the document
    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an inventory data extraction assistant. Your job is to extract inventory items from documents (CSV, text tables, lists, etc.) and return them in a structured format.

Extract the following fields for each item:
- name (required): The item name
- sku: Stock keeping unit / product code (optional)
- description: Item description (optional)
- quantity: Current stock quantity (default to 0 if not specified)
- min_quantity: Minimum stock threshold (default to 5 if not specified)
- unit_cost: Cost per unit in dollars as a NUMBER (optional). If a price range is given like "$75 - $200", use the FIRST number (75). Remove currency symbols and commas.
- supplier: Supplier name (optional)
- category: Item category (optional)

IMPORTANT: 
- unit_cost MUST be a number (e.g., 12.99), NOT a string
- For price ranges like "$75 - $200" or "$50-$100", extract ONLY the first number (75 or 50)
- Remove all currency symbols ($) and commas from numbers

Return ONLY a valid JSON array of items. Do not include any explanations or markdown formatting.
If no valid inventory data is found, return an empty array: []

Example output format:
[
  {"name": "Air Filter", "sku": "AF-001", "quantity": 50, "min_quantity": 10, "unit_cost": 12.99, "category": "Filters", "supplier": "HVAC Supplies Inc"},
  {"name": "Capacitor 35/5", "sku": "CAP-355", "quantity": 25, "min_quantity": 5, "unit_cost": 8.50, "category": "Electrical"}
]`
          },
          {
            role: "user",
            content: `Extract inventory items from this document:\n\n${documentContent}`
          }
        ],
      });
    if (responseFellBack) console.warn(`[parse-inventory-document] primary model unavailable, served by ${responseModel}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", aiContent);

    // Parse the AI response
    let extractedItems;
    try {
      // Clean up potential markdown formatting
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      extractedItems = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse inventory data from document", aiResponse: aiContent }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(extractedItems)) {
      return new Response(
        JSON.stringify({ error: "Invalid inventory data format", aiResponse: aiContent }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper function to parse price/cost values that may be strings with ranges or currency
    const parseUnitCost = (value: any): number | null => {
      if (typeof value === 'number') return Math.max(0, value);
      if (typeof value !== 'string') return null;
      
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '').trim();
      // Handle price ranges like "75 - 200" by extracting first number
      const match = cleaned.match(/^([\d.]+)/);
      if (match) {
        const num = parseFloat(match[1]);
        return isNaN(num) ? null : Math.max(0, num);
      }
      return null;
    };

    // Validate and normalize items
    const validatedItems = extractedItems
      .filter((item: any) => item && typeof item.name === 'string' && item.name.trim())
      .map((item: any) => ({
        company_id: companyId,
        name: item.name.trim(),
        sku: item.sku?.toString().trim() || null,
        description: item.description?.toString().trim() || null,
        quantity: typeof item.quantity === 'number' ? Math.max(0, Math.floor(item.quantity)) : 0,
        min_quantity: typeof item.min_quantity === 'number' ? Math.max(0, Math.floor(item.min_quantity)) : 5,
        unit_cost: parseUnitCost(item.unit_cost),
        supplier: item.supplier?.toString().trim() || null,
        category: item.category?.toString().trim() || null,
        is_active: true,
      }));

    console.log(`Extracted ${validatedItems.length} valid inventory items`);

    // Insert items into database
    if (validatedItems.length > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: insertedData, error: insertError } = await supabase
        .from("inventory_items")
        .insert(validatedItems)
        .select();

      if (insertError) {
        console.error("Database insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save inventory items", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully inserted ${insertedData?.length || 0} items`);

      return new Response(
        JSON.stringify({
          success: true,
          itemsExtracted: validatedItems.length,
          itemsInserted: insertedData?.length || 0,
          items: insertedData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        itemsExtracted: 0,
        itemsInserted: 0,
        message: "No valid inventory items found in the document",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error parsing inventory document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
