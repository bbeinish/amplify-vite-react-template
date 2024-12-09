import type { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log(event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Video downloaded successfully",
    }),
  };
};
