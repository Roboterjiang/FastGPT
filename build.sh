# 登录腾讯云镜像仓库
docker login aidong-backend.tencentcloudcr.com --username 100020139216 --password eyJhbGciOiJSUzI1NiIsImtpZCI6IkY0NUs6VFRSQTpDRFVHOlhXV1Q6NUNBTjpUTTREOk5EQkI6VFZEUTpUWk5EOjNLQ1o6VDVNWjpGNkRLIn0.eyJvd25lclVpbiI6IjEwMDAwMTA3NDIwNyIsIm9wZXJhdG9yVWluIjoiMTAwMDIwMTM5MjE2IiwidG9rZW5JZCI6ImNnZTIxYTM2Nmd2azQzNjZrNWQwIiwiZXhwIjoxOTk0OTI0OTY4LCJuYmYiOjE2Nzk1NjQ5NjgsImlhdCI6MTY3OTU2NDk2OH0.VJjIvUTk_PheJSyv-Msvwj2jy5ieZEu57_buw4Anqpb5MZQ8UNm3PN5AyWU9K2QInXprt7vILVAobhm3UhlwNR4XzM7UvdyY81-FBj5FNpDjhe3DvB0eUHPbeKmSjzTuFPiON5PXYJZBb4HNu3g2u75Ehxb-TD9p7wCPpknMuVWBLDuGsgQdRwqXMI90jI4xhnD4wa4WE9lJPU438D05LAVMJSE0PEU2b2u_z8J0QzK2j7dzNzcGu86s47W3S-_oAP8tabe3GPQ6rZmnoDuXQ0KZPgF4sDxILNYlPNa0bptgc83xuTSIfDIXsAihzH1EzKjEt4biNxnQVHfFSHakRA



#构建爱动镜像
# docker build -f ./projects/app/Dockerfile -t aidong-backend.tencentcloudcr.com/aidong/fastgpt:v4.8.5 . --build-arg name=aidongfastgpt --build-arg proxy=taobao

#构建林德版本镜像
# docker build -f ./projects/app/Dockerfile -t aidong-backend.tencentcloudcr.com/aidong/fastgpt:lindev4.8.5 . --build-arg name=lindefastgpt --build-arg proxy=taobao


#构建中力版本镜像
# docker build -f ./projects/app/Dockerfile -t aidong-backend.tencentcloudcr.com/aidong/fastgpt:zlv4.8.5 . --build-arg name=zlfastgpt --build-arg proxy=taobao

# docker push aidong-backend.tencentcloudcr.com/aidong/fastgpt:lindev4.8.5

docker push aidong-backend.tencentcloudcr.com/aidong/fastgpt:zlv4.8.5


