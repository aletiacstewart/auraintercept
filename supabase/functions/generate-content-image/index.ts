import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, companyId, style } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company name for better prompts
    let companyName = "";
    if (companyId) {
      const authz = await authorizeInternalRequest(req, companyId);
      if (!authz.ok) {
        return new Response(JSON.stringify({ error: authz.error }), {
          status: authz.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .single();
      if (data) companyName = data.name;
    }

    const imageStyle = style || "professional social media graphic";
    const prompt = `Create a visually appealing ${imageStyle} image for the following topic: "${topic}"${companyName ? ` for the business "${companyName}"` : ""}. The image should be modern, clean, and suitable for social media posts and marketing materials. Do not include any text or words in the image. Focus on relevant imagery, colors, and composition. Square aspect ratio 1:1. Ultra high resolution.`;

    console.log("[generate-content-image] Generating image for topic:", topic);

    const { response: aiResponse, modelUsed: aiResponseModel, fellBackFromPrimary: aiResponseFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      });
    if (aiResponseFellBack) console.warn(`[generate-content-image] primary model unavailable, served by ${aiResponseModel}`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-content-image] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("[generate-content-image] No image in response");
      return new Response(JSON.stringify({ error: "No image was generated. Try a different topic." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${companyId || "general"}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${imageFormat}`;

    const { error: uploadError } = await supabase.storage
      .from("content-images")
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-content-image] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage
      .from("content-images")
      .getPublicUrl(fileName);

    console.log("[generate-content-image] Image saved:", publicUrl.publicUrl);

    return new Response(JSON.stringify({
      image_url: publicUrl.publicUrl,
      message: "Image generated successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-content-image] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
