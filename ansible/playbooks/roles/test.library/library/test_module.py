# 이 ansible 모듈에서 이 함수(AnsibleModule)를 가져온다.
from ansible.module_utils.basic import *
# from ansible.module_utils.urls import *
# from ansible.module_utils.install_tarball_from_url import *
# import pathlib
import subprocess
import sys, urllib


def run_command2(command=''):
    # ansible-playbook 의 AttributeError: 'NoneType' object has no attribute 'isatty' 오류를
    # 막기 위해 stdin = subprocess.DEVNULL 이 필요 함
    subprocess.Popen(
        command,
#         stdin=subprocess.DEVNULL,
        shell=True,
#         start_new_session=True
    )
#     completed_proc = subprocess.Popen(args=command_and_args,
#                                     stdin=subprocess.DEVNULL,
#                                     stdout=subprocess.PIPE,
#                                     stderr=subprocess.STDOUT,
#                                     close_fds=True)

#     logging_if_error(cwd, command_and_args, completed_proc)

#     return (completed_proc.returncode, completed_proc.stdout.decode("utf-8"))

def openFile(p):
    return open(p, 'r', encoding='utf-8')

def main():
    module = AnsibleModule(argument_spec=dict())

    run_command2('ls -al > test.txt')
#     print_text()
#     (rc, output) = run_command2('/', ['ls', '-al'])
    args2 = ['ls', '-al']
#     module.run_command(['touch' 'test.txt'])
    rc, stdout, stderr = module.run_command(args2, check_rc=True)

#     new_stdout = unicode(stdout, 'unicode-escape')
#     print(type(new_stdout))

#     if len(stdout) == 0


    # 성공적인 리턴은 다음과 같이 구성됩니다.
#     if rc == 0:
    module.exit_json(
#         changed=True,
        changed=(rc == 0),
        msg=stdout
#         type=str(type(stdout))
        # ansible 이 artifects 내부에 남기는 (로그)데이터
#         msg=(stdout.strip())
    )
#     else:
#         module.fail_json(msg="error")



# 해당 모듈이 임포트된 경우가 아니라 인터프리터에서 직접 실행된 경우에만, if문 이하의 코드를 돌리라는 명령입니다.
# __name__이 무엇인데요?
# interpreter가 실행 전에 만들어 둔 글로벌 변수입니다.
# https://medium.com/@chullino/if-name-main-%EC%9D%80-%EC%99%9C-%ED%95%84%EC%9A%94%ED%95%A0%EA%B9%8C-bc48cba7f720
if __name__ == '__main__':
    main()
