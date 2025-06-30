import pandas as pd
import argparse
from pathlib import Path

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Build mappings between datasets.')
    parser.add_argument('-i', '--input_dir', type=str, default='../data', help="Path to the datasets")
    parser.add_argument('-o', '--output_dir', type=str, default='../data', help="Path to save the processed data")
    return parser.parse_args()


def main():
    args = parse_arguments()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    print("Input directory:", input_dir)
    print("Output directory:", output_dir)

    structured_scenarios = pd.read_csv(f"{input_dir}/structured_scenarios.csv")

    structured_scenarios['scenario_id'] = structured_scenarios['scenario'].str.split(' - ').str[0].str.extract('(\d+)', expand=False)
    structured_scenarios['scenario_type'] = structured_scenarios['scenario'].str.split(' - ').str[1]
    structured_scenarios['interlocutor'] = structured_scenarios['scenario'].str.split(' - ').str[2]
    structured_scenarios["interlocutor"] = structured_scenarios["interlocutor"].str.replace("communcaition with ", "communication with ")
    structured_scenarios["interlocutor"] = structured_scenarios["interlocutor"].str.replace("communication with ", "")
    
    # Add dialogue_ids.
    structured_scenarios["dialogue_id"] = 0
    dialogue_id = 1
    for index, row in structured_scenarios.iterrows():
        if row["utterance"] != "END":
            structured_scenarios.loc[index, "dialogue_id"] = dialogue_id
        else:
            structured_scenarios.loc[index, "dialogue_id"] = dialogue_id
            dialogue_id += 1
    
    structured_scenarios = structured_scenarios[[
        'dialogue_id', 
        'scenario_id', 
        'scenario_type', 
        'speaker', 
        'interlocutor', 
        'utterance'
    ]]

    structured_scenarios.to_csv(f"{output_dir}/structured_scenarios_preprocessed.csv", index=False)

if __name__ == '__main__':
    main()