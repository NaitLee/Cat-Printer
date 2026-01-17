# Container instructions

It's also possible to use cat-printer as a container. Here are some instructions
to have it working.  

_This is an OCI comptaible Container file, it should work with any OCI
compatible engine however it was tested mainly with podman._

In case you are using `docker` change any `podman` command to `docker`.  

#### Requirements

* `podman` - 4.7+
* `podman-compose` - 1.0.6+

#### Building the container

Here's some options to build the container.  

1. Building with compose: 
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install podman-compose
(cd build-container;podman compose build)
```
_this will build and start the container_  

2. Building manually:
```bash
(cd build-container;podman build -f Containerfile -t catprinter:latest ../)
```

#### Running the container

1. Run with compose:  
```bash
(cd build-container;podman compose up)
```
_with compose you can also build and run in a single command e.g: `(cd
build-container;podman compose up --build)`_  

2. Run manually:
```bash
podman run --rm --name catprinter -d -p 8095:8095 \ 
    -v /run/dbus:/run/dbus \
    --device /dev/usb/:/dev/usb \
    --security-opt label=disable \
    --security-opt unmask=ALL \
    --userns=keep-id \
    catprinter
```
_cat-printer, need access to dbus and the bluetooth device, since this usually
requires elevated priviledge, the se-linux labeling is disable to the container_  


#### TODO

- [ ] Makefile for building the container
- [ ] Automation to build container via CI on every release
- [ ] Add quadlet support
