export interface GenerateSlidesParams {
  text: string;
  file?: File;
  model: string;
}

export const generateSlides = async ({
  text,
  file,
  model,
}: GenerateSlidesParams) => {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("model", model);
  if (file) formData.append("file", file);

  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/message`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  return response.body;
};
