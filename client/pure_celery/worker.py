import pathlib
import paramiko
from celery import Celery

# client_dir = pathlib.Path(__file__).resolve().parent.parent
# sys.path.append(f'{client_dir}')

print(__name__)

# module 이름은 cli 에서의 -A 옵션값과 무관하다.
# 즉 다르게 지정해도 상관없다.
app = Celery(__name__, broker='redis://localhost:6380/0', backend='redis://localhost:6380/0')

# 생성된 app 에 hello task 를 등록한다.
@app.task(name='hello', bind=True)
def hello(self):
    return 'hello world'

@app.task(name='shell', bind=True)
def shell(self):
    base_path = pathlib.Path(__file__).parent.parent.parent

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    # 호스트 키가 없을 때에 사용할 정책을 정합니다.
    client.connect('192.168.200.123', 22, 'nm')
    stdin, stdout, stderr = client.exec_command(command='ls -al')
#     output = stdout.read().decode('utf-8').strip('\n')
    output = stdout.readlines()

    client.close()

    return dict(result=output)
