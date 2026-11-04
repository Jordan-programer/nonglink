import paramiko
import sys

def exec_cmd(cmd):
    host = "13.140.190.1"
    user = "root"
    pwd = "Ansebast19"
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pwd, timeout=15)
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    client.close()
    return out, err

if __name__ == "__main__":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    command = sys.argv[1] if len(sys.argv) > 1 else "docker ps"
    out, err = exec_cmd(command)
    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)
