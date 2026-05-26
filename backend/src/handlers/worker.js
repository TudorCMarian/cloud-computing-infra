import { writeSnippetToDb } from "./snippets.js";

export const handler = async (event) => {
  console.log(`Received ${event.Records.length} messages from SQS`);

  for (const record of event.Records) {
    try {
      const snippetData = JSON.parse(record.body);

      // Call the raw DynamoDB function we defined in snippets.js
      await writeSnippetToDb(snippetData);

      console.log(`Successfully saved snippet ${snippetData.snippetId} to DynamoDB`);
    } catch (error) {
      console.error("Error processing SQS message:", error);
      // Throwing the error tells SQS the write failed, so it will retry the message later
      throw error;
    }
  }
};