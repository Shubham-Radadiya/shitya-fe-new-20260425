import React from 'react';
import { useDispatch } from 'react-redux';
import closeicon from "../../images/closeicon.png";
import './modalstyle.css';
import { DELETE_SUBCATEGORY } from '../../../store/subcategory/SubCategoryAction';
import { toast } from 'react-toastify';

const RemoveSubcategory = ({ closeModal, confirmRemove, subcategoryId }) => {
  const dispatch = useDispatch();

  const deleteSubcategory = async (id) => {
    try {
      await dispatch({ type: DELETE_SUBCATEGORY, payload: id });
      confirmRemove();
    } catch (error) {
      toast.error("Error deleting subcategory:", error);
    }
  };

  return (
    <div className="admin-modal show">
      <div className="remove-modal-content">
        <img src={closeicon} alt="Close" className='remove-img' onClick={closeModal} />
        <p>Are you sure you want to remove this subcategory?</p>
        <div className="modal-bottom-btn">
          <button className='modal-btn' onClick={() => deleteSubcategory(subcategoryId)}>Delete</button>
          <button className='modal-btn' onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default RemoveSubcategory;
