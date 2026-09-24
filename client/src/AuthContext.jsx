import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login, logout } from '../api/authApi';