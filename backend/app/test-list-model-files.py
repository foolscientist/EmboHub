import requests


def login_and_get_token(username="zxc", password="123456"):
    res = requests.post(
        "http://localhost:8000/auth/login",
        json={"username": username, "password": password},
    )
    return res.json().get("access_token")


if __name__ == "__main__":
    model_id = 7
    res = requests.get(f"http://localhost:8000/models/{model_id}/files/experimental")
    print(res)
    print(res.text)
