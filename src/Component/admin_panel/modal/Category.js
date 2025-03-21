import React, { useState } from 'react';
import './modalstyle.css';
import { useDispatch } from 'react-redux';
import { CREATE_CATEGORY_REQUEST } from '../../../store/category/categoryActionType';

const Category = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [categoryData, setCategoryData] = useState({});
  const handleChange = (event) => {
    setCategoryData({
      ...categoryData,
      [event.target.name]: event.target.value,
    });
  };
  const HandleCreateCategory = async () => {
    try {
      dispatch({ type: CREATE_CATEGORY_REQUEST, payload: categoryData });
      closeModal();
    } catch (error) {
      throw error;
    }
  }; 

  return (
    <>
      <div className="admin-modal show">
        <div className="admin-modal-content">
          <div className='flexbtw'>
            <h3 className='modal-title'>Add Category</h3>
            <span className="closeicon" onClick={closeModal}>&times;</span>
          </div>
          <div className="modal-form">
            <div>
              <label className='modal-label'>
                Category Name:
                <input id='name' type="text" name="name" className='modal-input' onChange={handleChange} />
              </label>
            </div>
            <div className='modal-bottom-btn'>
              <button className="modal-btn" type="button" onClick={HandleCreateCategory}>Submit</button>
              <button className="modal-btn" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Category;
