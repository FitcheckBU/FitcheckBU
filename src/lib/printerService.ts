const API_URL = "https://printer.fitcheckbu.com/api/print/barcode";

/**
 * Sends a request to the printing API to print a barcode.
 * @param sku The SKU to be printed on the barcode.
 * @returns A promise that resolves when the request is complete.
 */
export const printBarcode = async (sku: string): Promise<void> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: sku,
        type: "CODE128",
        width: 2,
      }),
    });

    if (!response.ok) {
      console.error("Failed to print barcode:", response.statusText);
      // Depending on requirements, you might want to throw an error here
      // to be caught by the calling function.
      // throw new Error(`Failed to print barcode: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending barcode to printer:", error);
    // Also consider re-throwing or handling the error as needed.
    // throw error;
  }
};
