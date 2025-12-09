import mammoth from "mammoth";
import * as XLSX from "xlsx";
import officeParser from "officeparser";

import fs from "fs/promises";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { extractText } from "unpdf";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  extension: string,
): Promise<string> {
  try {
    // PDF
    if (mimeType === "application/pdf" || extension === ".pdf") {
      try {
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(buffer);
        const { text } = await extractText(uint8Array, { mergePages: true });
        return text.trim() || "[No text content found in PDF]";
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        return `[Error extracting PDF: ${(error as Error).message}]`;
      }
    }

    // DOCX
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === ".docx"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // XLSX
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      extension === ".xlsx"
    ) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let text = "";
      workbook.SheetNames.forEach((sheetName) => {
        const rowObject = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        });
        if (rowObject.length > 0) {
          text += `Sheet: ${sheetName}\n`;
          rowObject.forEach((row: any) => {
            text += row.join("\t") + "\n";
          });
          text += "\n";
        }
      });
      return text;
    }

    // PPTX
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      extension === ".pptx"
    ) {
      // officeParser often requires a file path. We'll write a temp file.
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `${uuidv4()}.pptx`);

      try {
        await fs.writeFile(tempFilePath, buffer);
        return await officeParser.parseOfficeAsync(tempFilePath);
      } finally {
        // Cleanup temp file
        await fs.unlink(tempFilePath).catch(() => {});
      }
    }

    // Fallback for plain text
    if (
      mimeType.startsWith("text/") ||
      extension === ".txt" ||
      extension === ".md" ||
      extension === ".csv"
    ) {
      return buffer.toString("utf-8");
    }

    return "";
  } catch (error) {
    console.error(`Error extracting text from ${extension} file:`, error);
    return `[Error extracting content: ${(error as Error).message}]`;
  }
}
