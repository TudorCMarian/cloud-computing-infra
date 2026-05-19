import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const TABLE = process.env.DYNAMODB_TABLE;

export async function getSnippets(userId) {
  const cmd = new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: marshall({ ":uid": userId }),
    ScanIndexForward: false, // newest first
    Limit: 50,
  });

  const result = await client.send(cmd);
  return (result.Items ?? []).map(unmarshall);
}

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

  await client.send(
    new PutItemCommand({
      TableName: TABLE,
      Item: marshall(item),
    })
  );

  return item;
}
