export async function analyzeImage(url) {
  const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_GOOGLE_VISION_API_KEY');
  }

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: url } },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 5 },
              { type: 'WEB_DETECTION', maxResults: 5 },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Vision API request failed: ${res.statusText}`);
  }

  const json = await res.json();
  const response = json.responses?.[0] || {};

  const labels = response.labelAnnotations || [];
  const web = response.webDetection || {};

  const labelTags = labels.map((l) => l.description).filter(Boolean);
  const webTags =
    web.bestGuessLabels?.map((b) => b.label).filter(Boolean) || [];
  const tags = Array.from(new Set([...labelTags, ...webTags]));
  const description = webTags[0] || labelTags[0] || '';

  return {
    description,
    tags,
    captions: description ? [description] : [],
  };
}

