import api from "./api";

export const importDataMasterLapChemical = async (previewId) => {
  const response = await api.post(
    `/import/master-data/lap-chemical?preview_id=${previewId}`,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};

export const importDataMasterLapChemicalPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-chemical/preview",
    formData,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};

export const importDataMasterLapPembelian = async (previewId) => {
  const response = await api.post(
    `/import/master-data/lap-pembelian?preview_id=${previewId}`,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};

export const importDataMasterLapPembelianPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-pembelian/preview",
    formData,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};

export const importDataMasterLapCk = async (previewId) => {
  const response = await api.post(
    `/import/master-data/lap-ck?preview_id=${previewId}`,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};

export const importDataMasterLapCkPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-ck/preview",
    formData,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
};
