import { CalculatedFinancialResponseModel } from "../models/financialResponse.model";

export const saveFinancialResponse = async (data: any): Promise<void> => {
  try {
    const calculationMeta = data?.calculationResult?.meta;
    const inputData = data?.inputData;
    const rawPayload = data?.rawPayload;

    const name = String(
      data?.name
      || calculationMeta?.name
      || inputData?.name
      || rawPayload?.name
      || ""
    ).trim();
    const email = String(
      data?.email
      || calculationMeta?.email
      || inputData?.email
      || rawPayload?.email
      || ""
    ).trim();
    const phone = String(
      calculationMeta?.phone
      || inputData?.phone
      || rawPayload?.phone
      || data?.phone
      || ""
    ).trim();
    const phoneDigits = String(phone || "").replace(/\D/g, "");

    const document = new CalculatedFinancialResponseModel({
      ...data,
      name,
      email,
      phone,
      phoneDigits
    });
    await document.save();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[financial-response] save failed:", message);
  }
};

export const findCustomerRecord = async (search: string): Promise<any[]> => {
  const trimmedSearch = search.trim();
  const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchDigits = trimmedSearch.replace(/\D/g, "");
  const textRegexQuery = new RegExp(escapedSearch, "i");
  const digitRegexQuery = searchDigits ? new RegExp(searchDigits, "i") : null;
  const isPhoneSearch = searchDigits.length >= 7;

  const queryOrConditions: Record<string, unknown>[] = [
    { name: { $regex: textRegexQuery } },
    { email: { $regex: textRegexQuery } },
    { phone: { $regex: textRegexQuery } }
  ];

  if (digitRegexQuery) {
    queryOrConditions.push(
      { phoneDigits: { $regex: digitRegexQuery } },
      { "inputData.phone": { $regex: digitRegexQuery } },
      { "calculationResult.meta.phone": { $regex: digitRegexQuery } }
    );
  }

  const records = await CalculatedFinancialResponseModel.find({
    $or: queryOrConditions
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!isPhoneSearch) {
    return records;
  }

  return records.filter((record) => {
    const name = String(record?.name || "");
    const email = String(record?.email || "");
    const nameMatches = textRegexQuery.test(name);
    const emailMatches = textRegexQuery.test(email);

    const topPhoneDigits = String(record?.phone || "").replace(/\D/g, "");
    const inputPhoneDigits = String(record?.inputData?.phone || "").replace(/\D/g, "");
    const metaPhoneDigits = String(record?.calculationResult?.meta?.phone || "").replace(/\D/g, "");
    const phoneMatches =
      topPhoneDigits.includes(searchDigits)
      || inputPhoneDigits.includes(searchDigits)
      || metaPhoneDigits.includes(searchDigits);

    return nameMatches || emailMatches || phoneMatches;
  });
};

export const updateCustomerRecord = async (
  id: string,
  data: any
): Promise<any | null> => {
  const existingRecord = await CalculatedFinancialResponseModel.findById(id).lean();
  if (!existingRecord) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }
  if (data.inputData !== undefined) {
    updateData.inputData = data.inputData;
  }
  if (data.normalizedData !== undefined) {
    updateData.normalizedData = data.normalizedData;
  }
  if (data.calculationResult !== undefined) {
    updateData.calculationResult = data.calculationResult;
  }
  if (data.webhookResponse !== undefined) {
    updateData.webhookResponse = data.webhookResponse;
  }

  const finalPhone = String(
    data?.phone
    || data?.inputData?.phone
    || data?.calculationResult?.meta?.phone
    || existingRecord?.phone
    || ""
  ).trim();
  updateData.phone = finalPhone;
  updateData.phoneDigits = String(finalPhone || "").replace(/\D/g, "");

  return CalculatedFinancialResponseModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).lean();
};
