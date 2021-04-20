#!/usr/local/bin/python3

import ansible_runner
import pathlib
import json
import time
from celery import Celery

BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

app = Celery('tasks', broker=BROKER_URL, backend=CELERY_RESULT_BACKEND)

# @app.task
# def add(x, y):
#     return x + y

def _make_events(p):
    if p.exists():
#     non_partial = filter(
#         (lambda x: not x.name.split('-')[-1].startswith('partial')),
#         p.iterdir())
        def gen():
            for f in sorted(p.iterdir(), key=(lambda x: int(x.name.split('-', 1)[0]))):
#                 print(f)
                try:
                    yield dict(json.load(open(f, 'r', encoding='utf-8')))["stdout"]
                except json.decoder.JSONDecodeError:
                    pass
        return gen()
    else:
        return None


def openFile(p):
    return open(p, 'r', encoding='utf-8')

# @app.task
@shared_task(name='celery.task.test', bind=True)
def run():
#         iso_dir = tempfile.mkdtemp(
#             prefix=playbook,
#             dir=private_data_dir
#         )

    default_path = pathlib.Path(__file__).parent

#         print(str(pathlib.Path(__file__).parent))
    params = dict(
        private_data_dir=str(default_path),
        playbook='playbooks/test.yaml',
        inventory=str(default_path / 'hosts.ini'),
        quiet=True,
    )
#         print(str(pathlib.Path(__file__).parent / 'playbooks'))
# #         params['private_data_dir'] = iso_dir
# #         playbook = 'test.yaml'
# #         params.update(**kw)
# #         if all([
# #             getattr(settings, 'AWX_ISOLATED_KEY_GENERATION', False) is True,
# #             getattr(settings, 'AWX_ISOLATED_PRIVATE_KEY', None)
# #         ]):
# #             params['ssh_key'] = settings.AWX_ISOLATED_PRIVATE_KEY
    result = ansible_runner.interface.run(**params)
    ident = result.config.ident
    command_path = default_path / 'artifacts' / ident / 'command'
    job_events_path = default_path / 'artifacts' / ident / 'job_events'
#

#
# #         ret = {}
#
# #         ret["message"] = json.dumps(json.load(openFile(command_path)))
    event_list = list(_make_events(job_events_path))
#
# #         list_msg = ''
#
# #         for value in event_list:
# #             list_msg += f'{json.dumps(value)},'
# #
#         list_msg = list_msg[:-1]
    json_list = json.dumps(event_list)
#
#
# #         ret["event_list"] = 'test'
#
# #             result_item = {
# #                 'name': "{0}/{1}".format(dict_group, dict_subname),
# #                 'major_version': get_major_version(dict_version),
# #                 'rsync_full_path': rsync_full_path,
# #                 'rsync_suffix_path': rsync_suffix_path
# #             }
#
#     time.sleep(10)

    print(json_list)

    return True

# run()
