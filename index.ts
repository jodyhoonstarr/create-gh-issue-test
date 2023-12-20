import { z } from "zod";
import https from "https";

const postGithubIssue = async function () {
  const body =
    '{"repo":"wb-vietnam-low-carbon","title":"testbug2","body":"123","type":"Bug","jobId":""}';

  // zod validation
  const inputJson = JSON.parse(body ?? "{}");
  const inputSchema = z.object({
    repo: z.string(),
    title: z.string(),
    body: z.string(),
    type: z.string(),
    jobId: z.string().optional(),
  });

  let input: z.infer<typeof inputSchema> | null = null;
  try {
    input = inputSchema.parse(inputJson);
    console.log("validated");
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err.issues);
    }
  }

  if (!input) {
    console.log("could not validate input");
    return;
  }

  const bodyText = `Job ID: ${input.jobId}\nFeedback type: ${input.type}\nUser comments: ${input.body}`

  const issueData = {
    title: input.title,
    body: bodyText,
    labels: ["user submitted"],
  };

  // post request
  const reqPromise = await new Promise((resolve, reject) => {
    const req = https.request(
      `***REPO***`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "***TOKEN***",
          "User-Agent": "***USER-AGENT***",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res) => {
        let resBody = "";
        let parsedBody: {};

        // cumulate data
        res.on("data", (chunk) => {
          resBody += chunk;
        });

        // resolve/reject
        res.on("end", function () {
          try {
            parsedBody = JSON.parse(resBody);
          } catch (e) {
            reject(e);
          }
          resolve(parsedBody);
        });
      }
    );

    // reject on request error
    req.on("error", function (err) {
      reject(err);
    });

    req.write(JSON.stringify(issueData));
    req.end();
  });

  let res: any;
  try {
    res = await reqPromise;
  } catch (e) {
    console.log(e);
  }

  if (!res) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "failed" }),
    };
  } else {
    const issueNumber = res?.number ?? "unknown";
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", issueCreated: issueNumber }),
    };
  }
};

// hacky workaround for top level await
(async () => {
  try {
    const text = await postGithubIssue();
    console.log(text);
  } catch (e) {
    console.log(e);
  }
})();

export default { postGithubIssue };
