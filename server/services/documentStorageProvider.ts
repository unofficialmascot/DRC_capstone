import crypto from "crypto";

export interface UploadUrlInput {
  applicationId: number;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
}

export interface UploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  downloadUrl: string;
  expiresAt: string;
}

const DEFAULT_EXPIRATION_MS = 10 * 60 * 1000;

export class DocumentStorageProvider {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly expiresInMs: number;

  constructor(options?: { baseUrl?: string; secret?: string; expiresInMs?: number }) {
    this.baseUrl = (options?.baseUrl ?? process.env.DOCUMENT_STORAGE_BASE_URL ?? "").replace(/\/$/, "");
    this.secret = options?.secret ?? process.env.DOCUMENT_STORAGE_SECRET ?? "document-storage-secret";
    this.expiresInMs = options?.expiresInMs ?? DEFAULT_EXPIRATION_MS;
  }

  generateUploadUrl(input: UploadUrlInput): UploadUrlResult {
    const objectKey = this.createObjectKey(input);
    const expiresAt = Date.now() + this.expiresInMs;
    const signature = this.signUpload({
      objectKey,
      expiresAt,
      contentType: input.mimeType,
      contentLength: input.fileSize,
    });

    const uploadUrl = this.buildUrl(
      `/api/storage/upload/${encodeURIComponent(objectKey)}`,
      {
        expires: expiresAt,
        signature,
        contentType: input.mimeType,
        contentLength: input.fileSize,
      },
    );

    return {
      uploadUrl,
      objectKey,
      downloadUrl: this.resolveDownloadUrl(objectKey),
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  resolveDownloadUrl(objectKey: string) {
    return this.buildUrl(`/api/storage/download/${encodeURIComponent(objectKey)}`);
  }

  verifyUploadSignature(params: {
    objectKey: string;
    expiresAt: number;
    contentType: string;
    contentLength: number;
    signature: string;
  }): boolean {
    if (Date.now() > params.expiresAt) {
      return false;
    }
    const expected = this.signUpload({
      objectKey: params.objectKey,
      expiresAt: params.expiresAt,
      contentType: params.contentType,
      contentLength: params.contentLength,
    });
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(params.signature);
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  isValidObjectKey(objectKey: string) {
    return /^[a-zA-Z0-9._-]+$/.test(objectKey);
  }

  private createObjectKey(input: UploadUrlInput) {
    const safeDocumentType = input.documentType
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "-") || "document";
    const safeName = input.fileName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const normalizedName = safeName.length > 0 ? safeName : "document";
    const randomToken = crypto.randomBytes(6).toString("hex");
    return `app-${input.applicationId}-${safeDocumentType}-${Date.now()}-${randomToken}-${normalizedName}`;
  }

  private signUpload(params: {
    objectKey: string;
    expiresAt: number;
    contentType: string;
    contentLength: number;
  }) {
    const payload = [
      params.objectKey,
      params.expiresAt,
      params.contentType,
      params.contentLength,
    ].join(":");
    return crypto.createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  private buildUrl(path: string, query?: Record<string, string | number>) {
    const base = `${this.baseUrl}${path}`;
    if (!query || Object.keys(query).length === 0) {
      return base;
    }
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    return `${base}?${searchParams.toString()}`;
  }
}
