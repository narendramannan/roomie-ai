export async function analyzeImage(url) {
  const apiKey = process.env.REACT_APP_HF_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_HF_API_KEY');
  }
  const imageRes = await fetch(url);
  const imageBytes = await imageRes.arrayBuffer();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/octet-stream',
  };

  const captionRes = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base?wait_for_model=true',
    {
      method: 'POST',
      headers,
      body: imageBytes,
    }
  );
  if (!captionRes.ok) {
    throw new Error(`Captioning failed: ${captionRes.statusText}`);
  }
  const captionData = await captionRes.json();
  const description = captionData?.[0]?.generated_text || '';

  const tagRes = await fetch(
    'https://api-inference.huggingface.co/models/google/vit-base-patch16-224?wait_for_model=true',
    {
      method: 'POST',
      headers,
      body: imageBytes,
    }
  );
  if (!tagRes.ok) {
    throw new Error(`Tagging failed: ${tagRes.statusText}`);
  }
  const tagData = await tagRes.json();
  const tags = Array.isArray(tagData) ? tagData.slice(0, 5).map((t) => t.label) : [];

  return { description, tags };
}
