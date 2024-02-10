@echo off
set venv_path=wvenv
set inst_next=_install.bat
set server_bat=server.bat
if not exist %venv_path% (set venv_init=1)
if defined venv_init (python -m venv %venv_path%)
type .\wvenv\Scripts\activate.bat > %inst_next%
if defined venv_init (echo pip install -r requirements.txt >> %inst_next%)
set venv_init=
echo echo Testing environment >> %inst_next%
python -c "print('python -c \x22with open(1, \x27wb\x27) as f: f.write(b\x27P4\\n384 0\\n\x27)\x22 | python printer.py -f MX06 -')" >> %inst_next%
type .\wvenv\Scripts\activate.bat > %server_bat%
echo python server.py >> %server_bat%
echo Run server.bat to start Cat-Printer
:: cmd bails out just after activation in batch
%inst_next%
