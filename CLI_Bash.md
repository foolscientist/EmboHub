# Bash 接口说明（上传 / 检索 / 下载）

> 适用对象：已在系统中注册并可登录的用户
> 基本地址：默认 `http://127.0.0.1:8000`

## 环境准备
- 需要 `curl` 与 `python`（用于解析 JSON）
- 建议先导出环境变量（可选）：
```
export BASE_URL="http://127.0.0.1:8000"
export USER_NAME="ops"
export USER_PASS="853211"
```

## 认证
### 注册
```
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"'$USER_NAME'","password":"'$USER_PASS'"}'
```

### 登录并获取 Token
```
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"'$USER_NAME'","password":"'$USER_PASS'"}' \
  | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
```
请求头携带：`-H "Authorization: Bearer $TOKEN"`

## 模型检索
### 列表查询
```
# 关键词（匹配 name/slug），标签与排序
curl "$BASE_URL/models?query=bert&tags=cv,transformer&sort=downloads"
```
返回示例：
```
[
  {"id":12,"name":"cute3","slug":"cute3","download_count":2, ...}
]
```

### 获取模型详情
```
curl "$BASE_URL/models/<model_id>"
```

### 获取模型文件列表
```
curl "$BASE_URL/models/<model_id>/files"
# 返回：[{"id":8,"filename":"xxx.bin","size":2655925,"mime":"application/octet-stream"}, ...]
```

## 上传
> 说明：上传接口是表单文件字段 `f`，支持多次调用同一模型以追加多个文件

### 创建模型（一次性创建）
```
curl -X POST "$BASE_URL/models" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name":"MobileNetV2",
        "slug":"mobilenetv2",
        "description":"Lightweight image model",
        "tags":"cv,light"
      }'
```
返回其中 `id` 为模型 ID。

### 上传单个文件
```
curl -X POST "$BASE_URL/models/<model_id>/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "f=@/path/to/model.bin;type=application/octet-stream"
```

### 多文件上传（同一模型，循环追加）
```
for f in /models/*.bin /models/*.pt; do
  curl -X POST "$BASE_URL/models/<model_id>/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "f=@$f;type=application/octet-stream"
done
```

## 下载
> 下载会更新对应模型的 `download_count`。若是 S3 存储，将返回一次性直链，请使用 `-L` 跟随重定向。

### 下载单个文件
```
curl -L -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/files/<file_id>/download" -o <保存文件名>
```

### 批量下载该模型所有文件
```
FILES_JSON=$(curl -s "$BASE_URL/models/<model_id>/files")
python - <<'PY'
import os,json,sys
j=json.loads(os.environ['FILES_JSON'])
for x in j:
    print(x['id'], x['filename'])
PY
```
将输出的 `id filename` 逐条下载：
```
while read fid fname; do
  curl -L -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/files/$fid/download" -o "$fname"
done < <(python - <<'PY'
import os,json
j=json.loads(os.environ['FILES_JSON'])
for x in j:
    print(x['id'], x['filename'])
PY
)
```

## 管理（管理员）
### 删除模型（级联删除版本与文件，并清理本地/S3）
```
curl -X DELETE "$BASE_URL/models/<model_id>" -H "Authorization: Bearer $TOKEN"
```

### 流量监控（查看进行中的下载进度）
```
curl "$BASE_URL/system/traffic" -H "Authorization: Bearer $TOKEN"
# 返回：{"active":[{"file_id":8,"filename":"xxx.bin","bytes":1048576,"total":5242880,"percent":20}],"capacity":5,"active_count":1}
```

## 常见问题
- 看到 `net::ERR_CONNECTION_RESET`：检查后端 `StaticFiles` 挂载是否指向正确绝对路径（仓库已修复）。
- 下载未跟随重定向：确保使用 `curl -L`（S3 直链场景必须）。
- 未携带鉴权导致 401：确认 `TOKEN` 获取成功并在请求中加入 `Authorization` 头。

## 示例脚本
- 批量下载脚本：`scripts/cli-download.sh`
  - 用法：`bash scripts/cli-download.sh <关键词或标识>`
  - 环境变量：`BASE_URL`、`USER_NAME`、`USER_PASS`、`SORT`

---
