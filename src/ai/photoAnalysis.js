const CAPTION_MODELS = [
  'Salesforce/blip-image-captioning-base',
  'nlpconnect/vit-gpt2-image-captioning',
];

const TAG_MODELS = [
  'google/vit-base-patch16-224',
  'microsoft/resnet-50',
];

async function postImage(model, imageBytes, headers) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}?wait_for_model=true`,
    {
      method: 'POST',
      headers,
      body: imageBytes,
    }
  );
  if (!res.ok) {
    throw new Error(`${model} failed: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeImage(url) {
  const apiKey = process.env.REACT_APP_HF_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_HF_API_KEY');
  }

  const imageRes = await fetch(url);
  if (!imageRes.ok) {
    throw new Error(`Image fetch failed: ${imageRes.statusText}`);
  }
  const imageBytes = await imageRes.arrayBuffer();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/octet-stream',
  };

  const captions = [];
  for (const model of CAPTION_MODELS) {
    try {
      const data = await postImage(model, imageBytes, headers);
      const text = data?.[0]?.generated_text || data?.[0]?.caption || '';
      if (text) captions.push(text);
    } catch (err) {
      console.error(`Caption model ${model} failed`, err);
    }
  }

  const tagSet = new Set();
  for (const model of TAG_MODELS) {
    try {
      const data = await postImage(model, imageBytes, headers);
      if (Array.isArray(data)) {
        data
          .slice(0, 5)
          .forEach((t) => {
            const label = t.label || t;
            if (label) tagSet.add(label);
          });
      }
    } catch (err) {
      console.error(`Tag model ${model} failed`, err);
    }
  }

  return {
    description: captions[0] || '',
    tags: Array.from(tagSet),
    captions,
  };
}
