import ansible_runner
import pathlib
import json
import time
import uuid
import datetime
import logging
from celery import shared_task

logger = logging.getLogger('django')

def _make_events(p):
    if p.exists():
        def gen():
            for f in sorted(p.iterdir(), key=(lambda x: int(x.name.split('-', 1)[0]))):
                print(f)
                try:
                    yield dict(json.load(open(f, 'r', encoding='utf-8')))
                except json.decoder.JSONDecodeError:
                    # 위에서 partial 파일을 이미 걸렀기 때문에
                    # 여기서 완성되지 못한 json 을 읽어서
                    # JSONDecodeError 가 발생할 수 없다. 그런데
                    # 실제로 발생한 이슈가 있었음. 파일을 쓰는
                    # 쪽에서 buffer flush 전에 filename rename 을
                    # 했으면 가능하긴 함..
                    pass
        return gen()
    else:
        return None


def openFile(p):
    return open(p, 'r', encoding='utf-8')

# shared_task 데코레이터를 통해, run celery task 가 등록된다.
@shared_task(name='run_ansible', bind=True)
def run_ansible(self):
    default_path = pathlib.Path(__file__).parent.parent.parent / 'ansible'

    params = dict(
        private_data_dir=str(default_path),
        playbook='playbooks/test.yaml',
        inventory=str(default_path / 'hosts.ini'),
        quiet=True,
        artifact_dir=str(default_path / 'ansible_runner' / 'default'),
        rotate_artifacts=200,
        ident=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-') + str(uuid.uuid4()),
    )

    result = ansible_runner.interface.run(**params)

    ident = result.config.ident
    command_path = default_path / 'ansible_runner' / 'default' / ident / 'command'
    job_events_path = default_path / 'ansible_runner' / 'default' / ident / 'job_events'

    events = list(_make_events(job_events_path))
    new_events = list(map(lambda x: x['stdout'], events))

    json_list = json.dumps(new_events)

    return json_list

