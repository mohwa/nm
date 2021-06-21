import pathlib
import json
import paramiko
from django.http import JsonResponse

def index(request):
    base_path = pathlib.Path(__file__).parent.parent.parent.parent

#     paramiko.util.log_to_file(str(base_path / 'var/log/ssh.log')

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    # 호스트 키가 없을 때에 사용할 정책을 정합니다.
#     client.set_missing_host_key_policy(paramiko.WarningPolicy())
    client.connect('192.168.200.123', 22, 'nm')
#     client.set_environment_variable(dict(ENV_NAME='DEV'))
#
    stdin, stdout1, stderr = client.exec_command(command='export ENV_NAME=DEV && echo $ENV_NAME')
#     output = stdout1.readlines()
    output = stdout1.read().decode('utf-8').strip('\n')

#     stdin, stdout2, stderr = client.exec_command(command='echo $TEST')
#     output2 = stdout2.readlines()
#
    client.close()
#
    return JsonResponse(dict(result=output))
