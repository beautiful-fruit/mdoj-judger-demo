import { getClient } from "https://deno.land/x/grpc_basic@0.4.7/client.ts";
import { Judger } from "../judger.d.ts";
import { logger } from "./logger.ts";

const protoPath = new URL("../judger.proto", import.meta.url);
const protoFile = await Deno.readTextFile(protoPath);

const languages: { [key: string]: string } = {
  "c": "7daff707-26b5-4153-90ae-9858b9fd9619",
  "cpp": "8a9e1daf-ff89-42c3-b011-bf6fb4bd8b26",
  "lua": "1c41598f-e253-4f81-9ef5-d50bf1e4e74f",
};

export default async function (
  code: string,
  language: string,
): Promise<string> {
  if (!(language in languages)) return "language not supported";
  const encoder = new TextEncoder();

  const client = getClient<Judger>({
    port: 8081,
    root: protoFile,
    serviceName: "Judger",
  });

  let result = "";
  for await (
    const reply of client.Exec(
      {
        langUid: languages[language],
        code: encoder.encode(code),
        memory: 1000000,
        time: 10000000,
        input: encoder.encode(""),
      },
    )
  ) {
    const decoder = new TextDecoder();
    try {
      if (reply.log != undefined) result += reply.log.msg + "\n";
      if (reply.output != undefined) result += decoder.decode(reply.output);
    } catch (err) {
      return "backend return error: " + err;
    }
  }
  return result;
}
