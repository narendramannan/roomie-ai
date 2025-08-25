export async function analyzeImage(url) {
  const apiKey = process.env.REACT_APP_HF_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_HF_API_KEY');
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const captionRes = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: url }),
    }
  );
  if (!captionRes.ok) {
    throw new Error(`Captioning failed: ${captionRes.statusText}`);
  }
  const captionData = await captionRes.json();
  const description = captionData?.[0]?.generated_text || '';

  const tagRes = await fetch(
    'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: url }),
    }
  );
  if (!tagRes.ok) {
    throw new Error(`Tagging failed: ${tagRes.statusText}`);
  }
  const tagData = await tagRes.json();
  const tags = Array.isArray(tagData) ? tagData.slice(0, 5).map((t) => t.label) : [];

  return { description, tags };
}
