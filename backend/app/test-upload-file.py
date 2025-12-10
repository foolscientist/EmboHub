import requests


def login_and_get_token(username="zxc", password="123456"):
    res = requests.post(
        "http://localhost:8000/auth/login",
        json={"username": username, "password": password},
    )
    return res.json().get("access_token")


if __name__ == "__main__":
    token = login_and_get_token()
    print("token is ", token)
    if not token:
        exit(0)
    model_id = 7
    files = {
        "f": open(
            "/home/homodeluna/insightos/model-runtime/models/yolov10s.onnx", "rb"
        ),
    }
    res = requests.post(
        f"http://localhost:8000/models/{model_id}/upload/experimental",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    print(res)
    print(res.text)
