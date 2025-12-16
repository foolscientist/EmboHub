import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/api"; // 假设你的 login 函数在 auth.js 文件中

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 检查 cookie 中是否存在 token
    const token = localStorage.getItem("token");
    if (token) {
      // 如果有 token，跳转到 /home
      navigate("/browse");
    }
  });

  const handleLogin = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // 重置错误信息

    try {
      const result = await api.login(username, password);
      if (result && result.access_token) {
        // 存储 token 到 cookie
        localStorage.setItem("token", result.access_token);
        // 跳转到 /home
        navigate("/browse");
      }
    } catch (err) {
      setError("登录失败，请检查用户名和密码"); // 显示错误信息
    }
  };

  return (
    <div>
      <h2>登录</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>
            用户名:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            密码:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit">登录</button>
        <p> {error}</p>
      </form>
    </div>
  );
};

export default Login;
