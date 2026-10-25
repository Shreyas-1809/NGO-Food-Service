#!/usr/bin/env python3
import sys
with open('C:\\Users\\Tanvi Prabhu\\OneDrive\\Documents\\NGO FOOD SERVICE\\NGO-Food-Service\\frontend\\src\\components\\AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
new_content = content.replace('\\\\u2665', '♥')
with open('C:\\Users\\Tanvi Prabhu\\OneDrive\\Documents\\NGO FOOD SERVICE\\NGO-Food-Service\\frontend\\src\\components\\AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Fixed AuthPage.jsx')