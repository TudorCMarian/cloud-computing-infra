import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

const dbClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const TABLE = process.env.DYNAMODB_TABLE;
const QUEUE_URL = process.env.SQS_QUEUE_URL;

export async function getSnippets(userId) {
  const cmd = new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: marshall({ ":uid": userId }),
    ScanIndexForward: false, // newest first
    Limit: 50,
  });

  const result = await dbClient.send(cmd);
  return (result.Items ?? []).map(unmarshall);
}

// ── PRODUCER: Sends data to SQS instead of DynamoDB ──
export async function saveSnippet({ userId, tool, input, output, label }) {
  const snippetId = randomUUID();
  const createdAt = new Date().toISOString();
  // TTL: 30 days from now
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const item = {
    userId,
    snippetId,
    tool,
    input,
    output: output ?? null,
    label: label ?? `${tool} — ${createdAt}`,
    createdAt,
    expiresAt,
  };

  // Push to SQS Queue for asynchronous processing
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(item),
    })
  );

  return item;
}

export async function writeSnippetToDb(snippet) {
  await dbClient.send(
    new PutItemCommand({
      TableName: TABLE,
      Item: marshall(snippet),
    })
  );
}