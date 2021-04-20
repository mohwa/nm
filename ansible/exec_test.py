def exec_test():
    for i in [1, 2, 3]:
        print(f'exec_test_{i}')


# exec_test()

def callback(x):
    print(x)
    return x

print(list(map(callback, [1.1, 2, 3])))
