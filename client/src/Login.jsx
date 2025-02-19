const Login = ({ login }) => {
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const formData = new FormData(ev.target);
        login({
          username: formData.get("username"),
          password: formData.get("password"),
        });
      }}
    >
      <input name="username" placeholder="Username" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
