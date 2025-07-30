import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserList() {
    const [usuarios, setUsuarios] = useState([]);
    const [items, setItems] = useState([]);
 

    useEffect(() => {

        const fetchUsuarios = async () => {
            const apiUrl = 'http://localhost:8000';
            console.log(`${apiUrl}/usuarios/`)

            const response = await axios.get(`${apiUrl}/usuarios/`);
            setUsuarios(response.data.usuarios);
            const response2 = await axios.get(`${apiUrl}/items/`);
            setItems(response2.data.items);
        }

        fetchUsuarios();
    }, []);

    return (
        <div style={{display: 'flex', flexDirection: 'row   ', alignItems: 'center'}}>
            <h1>listar usuarios</h1>
            <ul>
                {usuarios.map(usuario => (
                    <li key={usuario.id}>
                        ID: {usuario.id}, Nome: {usuario.nome}
                    </li>
                ))}
            </ul>
            <h1>listar items</h1>
            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        ID: {item.id}, Nome: {item.nome_item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;