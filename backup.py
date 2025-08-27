# %%
import datetime
import subprocess
from pathlib import Path

# %%
walkit_pods = subprocess.run(
    ["ssh", "akshar@aksharpatel47.com", "microk8s kubectl get pods -n walkit"],
    capture_output=True,
)

# %%
output = walkit_pods.stdout.decode("utf-8")
output_lines = output.split("\n")
# Find the line which starts with "walkit-db-deployment"
db_pod_name = next(
    (line for line in output_lines if line.startswith("walkit-db-deployment")), None
)

# %%
if not db_pod_name:
    print("No pod found")
else:
    db_pod_name = db_pod_name.split()[0]

# %%
timestamp = datetime.date.today().isoformat()
backup_file_name = f"walkit-db-backup-{timestamp}.sql"
print(f"Backing up to {backup_file_name}")

# %%

subprocess.run(
    [
        "ssh",
        "akshar@aksharpatel47.com",
        f'microk8s kubectl exec --stdin -n=walkit {db_pod_name} -- pg_dump -U postgres -a -f "{backup_file_name}" postgres',
    ]
)

print("Backup on server complete")

# %%
subprocess.run(
    [
        "ssh",
        "akshar@aksharpatel47.com",
        f"microk8s kubectl cp 'walkit/{db_pod_name}:/{backup_file_name}' '/home/akshar/walkit/{backup_file_name}'",
    ]
)

print("Moved backup file from pod to host")

# %%
p = Path(".") / "backup"

subprocess.run(
    [
        "scp",
        f"akshar@aksharpatel47.com:/home/akshar/walkit/{backup_file_name}",
        f"{p.absolute()}/{backup_file_name}",
    ]
)

print("Downloaded backup file from server to local")

# %%
# Remove the backup file from the server and pod
subprocess.run(
    ["ssh", "akshar@aksharpatel47.com", f"rm /home/akshar/walkit/{backup_file_name}"]
)

subprocess.run(
    [
        "ssh",
        "akshar@aksharpatel47.com",
        f"microk8s kubectl exec -n=walkit {db_pod_name} -- rm {backup_file_name}",
    ]
)

print("Removed backup file from server and pod")

# %%
