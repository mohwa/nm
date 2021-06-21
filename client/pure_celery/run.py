from datetime import datetime
from worker import hello, shell

result1 = hello.apply_async()
result2 = shell.apply_async()

start_time = datetime.now()
# 5 초
pending_timeout = 5

while True:
    elapsed_time = datetime.now() - start_time

    if (elapsed_time.seconds > pending_timeout):
        newResult = dict(states=str(f'{result1.state} / {result2.state}'), result=-1)
        break

    if result1.state == 'SUCCESS' and result2.state == 'SUCCESS':
        newResult = dict(states=str(f'{result1.state} / {result2.state}'), result1=result1.get(), result2=result2.get())
        break

print(newResult)
