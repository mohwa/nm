#!/usr/bin/env bash

variable=0

if [[ "$variable" == 0 ]]; then
  echo 0
else
  echo 1
fi

function stop_process() {
  local x=$1
  # 1을 return 한다
  echo "x=$x"
}

function stop_process1() {
  local x=$1
  # 1을 return 한다
  # return 은 0 ~ 255 까지의 숫자만 반환할 수 있다.
  # 보통 1, 0 만을 사용한다.
  return 1
}

function stop() {
  echo "start stop"

  while (( 1 )); do
    echo "start while statement"

    local result=$(stop_process "test1")
    echo "${result}"

    stop_process1 "test2"
    local result1=$?
    # 1 을 반환한다.
    echo $result1
#    stop_process

    #if [[ "$stop_process" == "1" ]]; then
    #  echo "break"
    #  break;
    #fi
    #printf "return 0\n"
    return 0
  done
  return 1
}

stop


for value in "test test test"; do
  echo -n ${value}
done
