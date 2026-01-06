import type { Request } from "express";

/**
 * Parse the with-metadata query parameter
 * Defaults to true if not provided
 * Returns false for: 0, "0", false, "false", "no"
 */
export function parseWithMetadata(req: Request): boolean {
	const withMetadata = req.query["with-metadata"];

	// If not provided, default to true
	if (withMetadata === undefined) {
		return true;
	}

	// Convert to string for comparison
	const value = String(withMetadata).toLowerCase();

	// Check for falsy values
	if (value === "0" || value === "false" || value === "no") {
		return false;
	}

	return true;
}

/**
 * Remove metadata from a single object
 */
function removeMetadataFromObject<T extends Record<string, unknown>>(
	obj: T,
): Omit<T, "metadata"> {
	const { metadata, ...rest } = obj;
	return rest as Omit<T, "metadata">;
}

/**
 * Remove metadata from response data if with-metadata is false
 * Handles both single metric responses and multiple metrics responses
 */
export function filterMetadata<T extends Record<string, unknown>>(
	data: T | undefined,
	withMetadata: boolean,
): T | Omit<T, "metadata"> | undefined {
	if (!data) {
		return data;
	}

	if (!withMetadata) {
		// If data has a "metrics" field (getAllMetrics response)
		if ("metrics" in data && typeof data.metrics === "object" && data.metrics) {
			const filteredMetrics: Record<string, unknown> = {};
			const metricsObj = data.metrics as Record<string, unknown>;

			// Remove metadata from each metric
			for (const [key, value] of Object.entries(metricsObj)) {
				if (value && typeof value === "object" && "metadata" in value) {
					filteredMetrics[key] = removeMetadataFromObject(
						value as Record<string, unknown>,
					);
				} else {
					filteredMetrics[key] = value;
				}
			}

			// Return data with filtered metrics and no metadata at root level
			const { metadata: rootMetadata, ...restData } = data;
			return {
				...restData,
				metrics: filteredMetrics,
			} as Omit<T, "metadata">;
		}

		// If data has metadata at root level only (single metric response)
		if ("metadata" in data) {
			return removeMetadataFromObject(data);
		}
	}

	return data;
}
