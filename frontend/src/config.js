// Values are injected by the CI/CD pipeline via Vite env vars.
// Locally, copy .env.example to .env and fill in terraform output values.
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [window.location.origin + "/callback"],
          redirectSignOut: [window.location.origin],
          responseType: "code",
        },
      },
    },
  },
};

export const API_BASE = import.meta.env.VITE_API_URL;
