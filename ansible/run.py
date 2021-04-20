#!/usr/local/bin/python3

from celery_test import run

result = run.apply_async()

while True:

    if result.state == 'SUCCESS':
        newResult = result.result
        break

print(newResult)

# is_ready = result.ready()
#
# 아래처럼 완료될 때까지 기다릴 수 있지만, 이는 비동기 호출을 동기 호출로 변환하기 때문에 거의 사용되지 않는다.
# https://velog.io/@yvvyoon/celery-first-step-2
# printResult = dict(
#     is_ready=str(is_ready),
#     result=str(result.get()),
# )



