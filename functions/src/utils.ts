import fetch from "node-fetch";

export async function getGithubUsername(githubId: string) {
  try {
    const response = await fetch(`https://api.github.com/user/${githubId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const jsonBody = await response.json();
    return jsonBody.login;
  } catch (error) {
    console.log(error);
    return null;
  }
}
