from django.contrib import admin
from .models import * 

import inspect
from . import models

for name, obj in inspect.getmembers(models):
    if inspect.isclass(obj) and issubclass(obj, models.models.Model):
        if not obj._meta.abstract:
            try:
                admin.site.register(obj)
            except admin.sites.AlreadyRegistered:
                pass