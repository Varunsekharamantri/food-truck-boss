// Generates an AI photo for a menu item, uploads to storage, and saves the URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { itemId, name, bucket } = await req.json();
    if (!itemId || !name) {
      return new Response(JSON.stringify({ error: "itemId and name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Top-down close-up appetizing food photograph of "${name}" — an Indian food-truck ${bucket || "dish"}. Vibrant, well-lit, served on a simple plate or wrapper, plain neutral background, no text, no logos, photorealistic, sharp focus.`;

    // Generate image (non-streaming → single JSON body)
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error ${aiRes.status}: ${errText}` }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const b64 = aiJson?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    // Decode base64 to bytes
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    // Upload to storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const path = `${itemId}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("menu-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    // Long-lived signed URL (10 years)
    const { data: signed, error: signErr } = await supabase.storage
      .from("menu-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed?.signedUrl) throw signErr || new Error("Sign failed");

    const imageUrl = signed.signedUrl;

    // Save URL on menu item
    const { error: updErr } = await supabase
      .from("menu_items")
      .update({ image_url: imageUrl })
      .eq("id", itemId);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
