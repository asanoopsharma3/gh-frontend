export const validate = (data) => {
  const error = {};

  if (!data.username.trim()) {
    error.username = "Username is required. Please enter your username.";
  }

  if (!data.password.trim()) {
    error.password = "Password is required. Please enter your password.";
  } else if (data.password.length < 6) {
    error.password = "Password must be at least 6 characters long.";
  }

  return error;
};
