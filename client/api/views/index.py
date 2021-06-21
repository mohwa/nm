from django.http import HttpResponse
from datetime import datetime
from django.http import JsonResponse
from django_celery_results.models import TaskResult

from api import tasks

def index(request):
    # s 는 subtask 의 단축 함수이다.
    # https://heodolf.tistory.com/63
    '''
    # delay와 apply_async
    task_1 = calc.add.delay( 1, 2 )
    task_2 = calc.add.apply_async( args=[3, 4], ignore_result=True )
    task_3 = calc.add.apply_async( args=[5, 6], kwargs={} )

    print( "# 1. Task ID 확인" )
    print( "task_1 is {}".format( task_1.id ) )
    print( "task_2 is {}".format( task_2.id ) )
    print( "task_3 is {}".format( task_3.id ) )

    print( "\n# 2. Task 상태" )
    print( "task_1 is ready? {}".format( task_1.ready() ) )
    print( "task_2 is ready? {}".format( task_2.ready() ) )
    print( "task_3 is ready? {}".format( task_3.ready() ) )

    print( "\n# 3. 실행결과 확인" )
    print( "task_1 is {}".format( task_1.get() ) )
    print( "task_2 is {}".format( task_2.get() ) )
    print( "task_3 is {}".format( task_3.get() ) )

    print( "\n# 4. Task 상태" )
    print( "task_1 is ready? {}".format( task_1.ready() ) )
    print( "task_2 is ready? {}".format( task_2.ready() ) )
    print( "task_3 is ready? {}".format( task_3.ready() ) )
    '''
    result = tasks.run_ansible.s().apply_async()

    start_time = datetime.now()
    # 5 초
    pending_timeout = 5

    while True:
        elapsed_time = datetime.now() - start_time

        if (elapsed_time.seconds > pending_timeout):
            newResult = dict(status=result.state, result=result.get())
            break
        if result.state == 'SUCCESS':
#             https://proinlab.com/archives/1562
            # result.result(str)을 utf-8 로 인코딩 후(유니코드 문자열을 가진 바이트형으로 캐스팅된다), 다시 이 데이터를 unicode-escape 를 통해, unescape(decode) 한다
            # decode 는 반드시 바이트형에서 해야만한다
            # 즉 특정 문자열을 encode(암호화)한다. < 바이트형으로 변형 < decode(복호화)한다.
            # 유니코드 문자열을 encode 를 통해, 유니코드 문자열을 가진 바이트형으로 변환 < 이것을 unicode-escape 로 decode 해서, 기존 유니코드 문자열을 "한글" 로 출력할 수 있게 만든다.

            if len(result.result) != 0:
                newResult = dict(result=result.result.encode('utf-8').decode('unicode-escape'), status=result.state)
            else:
                newResult = dict(result=[], status=result.state)
            break

    return JsonResponse(newResult)


def history(request):
    return HttpResponse(TaskResult.objects.filter(task_name='run_ansible').values('task_name', 'task_id', 'result', 'date_done', 'task_args', 'status'))
