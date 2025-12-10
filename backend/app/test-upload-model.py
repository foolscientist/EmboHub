import requests
from schemas import ModelInfo, ModelInfoMetric


def login_and_get_token(username="zxc", password="123456"):
    res = requests.post(
        "http://localhost:8000/auth/login",
        json={"username": username, "password": password},
    )
    return res.json().get("access_token")


if __name__ == "__main__":
    m = ModelInfo(
        name="yolov10s",
        fullname="yolov10s-onnx-test6",
        architecture="Yolov10",
        framework="onnxruntime",
        version="0.0.1",
        tags={},
        metrics=ModelInfoMetric(storage_gb=0.271833),
    )
    token = login_and_get_token()
    print("token is ", token)
    if not token:
        exit(0)
    res = requests.post(
        "http://localhost:8000/models/experimental",
        headers={"Authorization": f"Bearer {token}"},
        json=m.model_dump(),
    )
    print(res)
    print(res.text)
