"use server";

// Import all functions
import {
  createCollection as createCollectionFn,
  deleteCollection as deleteCollectionFn,
  listCollections as listCollectionsFn,
  getCollectionInfo as getCollectionInfoFn,
  testConnection as testConnectionFn,
} from "./actions/collections";

import {
  getCollectionDocuments as getCollectionDocumentsFn,
  queryCollection as queryCollectionFn,
  addDocument as addDocumentFn,
  updateDocument as updateDocumentFn,
  deleteDocument as deleteDocumentFn,
} from "./actions/documents";

import {
  uploadFile as uploadFileFn,
  processFiles as processFilesFn,
} from "./actions/uploads";

// Re-export each function individually with "use server" directive
export async function createCollection(
  ...args: Parameters<typeof createCollectionFn>
) {
  return createCollectionFn(...args);
}

export async function deleteCollection(
  ...args: Parameters<typeof deleteCollectionFn>
) {
  return deleteCollectionFn(...args);
}

export async function listCollections(
  ...args: Parameters<typeof listCollectionsFn>
) {
  return listCollectionsFn(...args);
}

export async function getCollectionInfo(
  ...args: Parameters<typeof getCollectionInfoFn>
) {
  return getCollectionInfoFn(...args);
}

export async function testConnection(
  ...args: Parameters<typeof testConnectionFn>
) {
  return testConnectionFn(...args);
}

export async function getCollectionDocuments(
  ...args: Parameters<typeof getCollectionDocumentsFn>
) {
  return getCollectionDocumentsFn(...args);
}

export async function queryCollection(
  ...args: Parameters<typeof queryCollectionFn>
) {
  return queryCollectionFn(...args);
}

export async function addDocument(...args: Parameters<typeof addDocumentFn>) {
  return addDocumentFn(...args);
}

export async function updateDocument(
  ...args: Parameters<typeof updateDocumentFn>
) {
  return updateDocumentFn(...args);
}

export async function deleteDocument(
  ...args: Parameters<typeof deleteDocumentFn>
) {
  return deleteDocumentFn(...args);
}

export async function uploadFile(...args: Parameters<typeof uploadFileFn>) {
  return uploadFileFn(...args);
}

export async function processFiles(...args: Parameters<typeof processFilesFn>) {
  return processFilesFn(...args);
}
