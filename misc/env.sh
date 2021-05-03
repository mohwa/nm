#!/usr/bin/env bash

export CWD=$(dirname "${BASH_SOURCE[0]}")
export BASE_DIR="$( cd "$CWD/.."  && pwd -P )"
export CONDA_ENV_NAME="pyenv39"

#function activate_env() {
##  conda init bash
#  echo $CONDA_ENV_NAME
#  source conda/bin/activate $CONDA_ENV_NAME
#}
#
#function deactivate_env() {
#  conda deactivate
#}
#
#function check_command() {
#  # $#: 함수 인자갯수를 받을 수 있다.
#  if ! [[ $# -lt 1 ]]; then
#    local command=$1
#    local valid_commands="activate deactivate"
#
#    for value in $valid_commands; do
#      if [[ $command == $value ]]; then
#        return 0
#      fi
#    done
#  fi
#
#  return 1
#}

#if check_command $1; then
#  if [[ $1 == "activate" ]]; then
#    activate_env
#  else
#    if [[ $1 == "deactivate" ]]; then
#      deactivate_env
#    fi
#  fi
#fi

#conda activate $CONDA_ENV_NAME
source conda/bin/activate $CONDA_ENV_NAME
